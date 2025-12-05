const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { Conversation, Message, User } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

// Auth for all routes
router.use(authenticateToken);

// GET /api/messages/conversations - Récupérer toutes les conversations de l'utilisateur
router.get('/conversations', async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('📥 Récupération des conversations pour userId:', userId);
    
    // Vérifier que les modèles sont bien chargés
    if (!Conversation || !User || !Message) {
      console.error('❌ Modèles non chargés:', { Conversation: !!Conversation, User: !!User, Message: !!Message });
      return res.status(500).json({
        success: false,
        message: 'Erreur de configuration des modèles'
      });
    }
    
    let conversations;
    try {
      // Essayer d'abord sans les includes pour voir si le problème vient des associations
      conversations = await Conversation.findAll({
        where: {
          [Op.or]: [
            { user1_id: userId },
            { user2_id: userId }
          ]
        },
        order: [
          ['last_message_at', 'DESC'],
          ['created_at', 'DESC']
        ],
        raw: false // Garder les instances Sequelize pour les includes
      });
      console.log(`✅ ${conversations.length} conversation(s) trouvée(s) sans includes`);
      
      // Charger les utilisateurs séparément pour éviter les problèmes d'association
      for (const conv of conversations) {
        try {
          const user1 = await User.findByPk(conv.user1_id, {
            attributes: ['id', 'prenom', 'nom', 'email', 'role', 'photo_url']
          });
          const user2 = await User.findByPk(conv.user2_id, {
            attributes: ['id', 'prenom', 'nom', 'email', 'role', 'photo_url']
          });
          conv.user1 = user1;
          conv.user2 = user2;
        } catch (userError) {
          console.error('Erreur lors du chargement des utilisateurs pour conversation', conv.id, ':', userError);
        }
      }
    } catch (queryError) {
      console.error('❌ Erreur lors de la requête Conversation.findAll:', queryError);
      console.error('Stack:', queryError.stack);
      throw queryError;
    }

    // Charger le dernier message pour chaque conversation séparément
    for (const conv of conversations) {
      if (conv.last_message_id) {
        try {
          const lastMsg = await Message.findByPk(conv.last_message_id, {
            attributes: ['id', 'content', 'created_at', 'sender_id']
          });
          conv.lastMessage = lastMsg;
        } catch (err) {
          console.error('Erreur lors du chargement du dernier message:', err);
          conv.lastMessage = null;
        }
      } else {
        conv.lastMessage = null;
      }
    }

    // Formater les conversations pour le frontend
    const formattedConversations = conversations
      .map(conv => {
        const otherUser = conv.user1_id === userId ? conv.user2 : conv.user1;
        const unreadCount = conv.user1_id === userId ? conv.user1_unread_count : conv.user2_unread_count;
        
        // Vérifier que otherUser existe
        if (!otherUser) {
          console.warn('⚠️ Conversation sans autre utilisateur:', conv.id, 'user1_id:', conv.user1_id, 'user2_id:', conv.user2_id);
          return null;
        }
        
        return {
          id: conv.id,
          user: {
            id: otherUser.id,
            prenom: otherUser.prenom,
            nom: otherUser.nom,
            email: otherUser.email,
            role: otherUser.role,
            photo_url: otherUser.photo_url
          },
          lastMessage: conv.lastMessage ? {
            content: conv.lastMessage.content,
            timestamp: conv.lastMessage.created_at
          } : null,
          lastMessageTime: conv.last_message_at ? new Date(conv.last_message_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : null,
          unreadCount: unreadCount || 0
        };
      })
      .filter(conv => conv !== null); // Filtrer les conversations invalides

    res.json({
      success: true,
      data: formattedConversations
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des conversations:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des conversations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/messages/conversation/:userId - Récupérer ou créer une conversation avec un utilisateur
router.get('/conversation/:userId', async (req, res) => {
  try {
    const userId = req.user.id;
    const otherUserId = parseInt(req.params.userId);

    if (userId === otherUserId) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas créer une conversation avec vous-même'
      });
    }

    // Vérifier que l'utilisateur existe
    const otherUser = await User.findByPk(otherUserId);
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Chercher une conversation existante
    let conversation = await Conversation.findOne({
      where: {
        [Op.or]: [
          { user1_id: userId, user2_id: otherUserId },
          { user1_id: otherUserId, user2_id: userId }
        ]
      },
      include: [
        {
          model: User,
          as: 'user1',
          attributes: ['id', 'prenom', 'nom', 'email', 'role', 'photo_url']
        },
        {
          model: User,
          as: 'user2',
          attributes: ['id', 'prenom', 'nom', 'email', 'role', 'photo_url']
        }
      ]
    });

    // Créer une nouvelle conversation si elle n'existe pas
    if (!conversation) {
      conversation = await Conversation.create({
        user1_id: userId < otherUserId ? userId : otherUserId,
        user2_id: userId < otherUserId ? otherUserId : userId
      });

      // Recharger avec les associations
      conversation = await Conversation.findByPk(conversation.id, {
        include: [
          {
            model: User,
            as: 'user1',
            attributes: ['id', 'prenom', 'nom', 'email', 'role', 'photo_url']
          },
          {
            model: User,
            as: 'user2',
            attributes: ['id', 'prenom', 'nom', 'email', 'role', 'photo_url']
          }
        ]
      });
    }

    const otherUserData = conversation.user1_id === userId ? conversation.user2 : conversation.user1;

    res.json({
      success: true,
      data: {
        id: conversation.id,
        user: {
          id: otherUserData.id,
          prenom: otherUserData.prenom,
          nom: otherUserData.nom,
          email: otherUserData.email,
          role: otherUserData.role,
          photo_url: otherUserData.photo_url
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération/création de la conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération/création de la conversation'
    });
  }
});

// GET /api/messages/:conversationId - Récupérer les messages d'une conversation
router.get('/:conversationId', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const conversationId = parseInt(req.params.conversationId);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    // Vérifier que l'utilisateur fait partie de la conversation
    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation non trouvée'
      });
    }

    if (conversation.user1_id !== userId && conversation.user2_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à cette conversation'
      });
    }

    // Récupérer les messages
    const { count, rows: messages } = await Message.findAndCountAll({
      where: { conversation_id: conversationId },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'prenom', 'nom', 'email', 'photo_url']
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    // Marquer les messages comme lus
    await Message.update(
      { is_read: true, read_at: new Date() },
      {
        where: {
          conversation_id: conversationId,
          receiver_id: userId,
          is_read: false
        }
      }
    );

    // Mettre à jour le compteur de messages non lus dans la conversation
    if (conversation.user1_id === userId) {
      await conversation.update({ user1_unread_count: 0 });
    } else {
      await conversation.update({ user2_unread_count: 0 });
    }

    // Formater les messages pour le frontend
    const formattedMessages = messages.reverse().map(msg => ({
      id: msg.id,
      text: msg.content,
      sender: msg.sender_id === userId ? 'me' : msg.sender_id,
      senderInfo: msg.sender,
      timestamp: new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      fullTimestamp: msg.created_at,
      type: msg.message_type,
      is_read: msg.is_read,
      file_url: msg.file_url,
      file_name: msg.file_name
    }));

    res.json({
      success: true,
      data: formattedMessages,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des messages'
    });
  }
});

// POST /api/messages - Envoyer un message
router.post('/', [
  body('conversation_id').isInt({ min: 1 }),
  body('receiver_id').isInt({ min: 1 }),
  body('content').isLength({ min: 1 }).withMessage('Le contenu du message ne peut pas être vide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const { conversation_id, receiver_id, content, message_type = 'text', file_url, file_name } = req.body;

    // Vérifier que l'utilisateur fait partie de la conversation
    const conversation = await Conversation.findByPk(conversation_id);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation non trouvée'
      });
    }

    if (conversation.user1_id !== userId && conversation.user2_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à cette conversation'
      });
    }

    // Vérifier que le destinataire est correct
    const correctReceiverId = conversation.user1_id === userId ? conversation.user2_id : conversation.user1_id;
    if (receiver_id !== correctReceiverId) {
      return res.status(400).json({
        success: false,
        message: 'Destinataire invalide'
      });
    }

    // Créer le message
    const message = await Message.create({
      conversation_id,
      sender_id: userId,
      receiver_id,
      content,
      message_type,
      file_url,
      file_name,
      is_read: false
    });

    // Charger le message avec les associations
    const messageWithSender = await Message.findByPk(message.id, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'prenom', 'nom', 'email', 'photo_url']
        }
      ]
    });

    // Mettre à jour la conversation
    await conversation.update({
      last_message_id: message.id,
      last_message_at: new Date()
    });

    // Incrémenter le compteur de messages non lus pour le destinataire
    if (conversation.user1_id === receiver_id) {
      await conversation.increment('user1_unread_count');
    } else {
      await conversation.increment('user2_unread_count');
    }

    // Formater le message pour le frontend
    const formattedMessage = {
      id: messageWithSender.id,
      text: messageWithSender.content,
      sender: 'me',
      senderInfo: messageWithSender.sender,
      timestamp: new Date(messageWithSender.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      fullTimestamp: messageWithSender.created_at,
      type: messageWithSender.message_type,
      is_read: false,
      file_url: messageWithSender.file_url,
      file_name: messageWithSender.file_name
    };

    // Émettre via Socket.io si disponible
    const io = req.app.get('io');
    if (io) {
      // Émettre au destinataire
      io.to(`user_${receiver_id}`).emit('new_message', {
        conversation_id,
        message: formattedMessage
      });

      // Émettre aussi à l'expéditeur pour confirmation
      io.to(`user_${userId}`).emit('message_sent', {
        conversation_id,
        message: formattedMessage
      });

      // Mettre à jour la liste des conversations pour les deux utilisateurs
      io.to(`user_${receiver_id}`).emit('conversation_updated', {
        conversation_id
      });
      io.to(`user_${userId}`).emit('conversation_updated', {
        conversation_id
      });
    }

    res.status(201).json({
      success: true,
      data: formattedMessage
    });
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi du message'
    });
  }
});

// PUT /api/messages/:messageId/read - Marquer un message comme lu
router.put('/:messageId/read', async (req, res) => {
  try {
    const userId = req.user.id;
    const messageId = parseInt(req.params.messageId);

    const message = await Message.findByPk(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message non trouvé'
      });
    }

    if (message.receiver_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez marquer que vos propres messages comme lus'
      });
    }

    await message.update({
      is_read: true,
      read_at: new Date()
    });

    // Mettre à jour le compteur de messages non lus dans la conversation
    const conversation = await Conversation.findByPk(message.conversation_id);
    if (conversation) {
      if (conversation.user1_id === userId) {
        await conversation.update({ user1_unread_count: 0 });
      } else {
        await conversation.update({ user2_unread_count: 0 });
      }
    }

    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du message:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du message'
    });
  }
});

// GET /api/messages/users - Récupérer la liste des utilisateurs disponibles pour le chat
router.get('/users/available', async (req, res) => {
  try {
    const userId = req.user.id;
    const { search } = req.query;

    // Construire la condition where
    // Récupérer tous les utilisateurs actifs (actif = true ou NULL) sauf l'utilisateur actuel
    const whereConditions = {
      [Op.and]: [
        { id: { [Op.ne]: userId } },
        {
          [Op.or]: [
            { actif: true },
            { actif: { [Op.is]: null } },
            { actif: 1 } // Pour MySQL TINYINT(1)
          ]
        }
      ]
    };

    // Ajouter la recherche si fournie
    if (search) {
      whereConditions[Op.and].push({
        [Op.or]: [
          { prenom: { [Op.like]: `%${search}%` } },
          { nom: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } }
        ]
      });
    }

    console.log('🔍 Recherche d\'utilisateurs:', { userId, search, whereConditions });

    // Essayer d'abord avec la condition actif
    let users = await User.findAll({
      where: whereConditions,
      attributes: ['id', 'prenom', 'nom', 'email', 'role', 'photo_url', 'derniere_connexion', 'actif'],
      order: [['nom', 'ASC'], ['prenom', 'ASC']],
      limit: 100
    });

    // Si aucun utilisateur trouvé, essayer sans la condition actif (pour debug)
    if (users.length === 0) {
      console.log('⚠️ Aucun utilisateur trouvé avec condition actif, essai sans condition actif...');
      const whereWithoutActif = {
        id: { [Op.ne]: userId }
      };
      if (search) {
        whereWithoutActif[Op.and] = [
          {
            [Op.or]: [
              { prenom: { [Op.like]: `%${search}%` } },
              { nom: { [Op.like]: `%${search}%` } },
              { email: { [Op.like]: `%${search}%` } }
            ]
          }
        ];
      }
      const allUsers = await User.findAll({
        where: whereWithoutActif,
        attributes: ['id', 'prenom', 'nom', 'email', 'role', 'photo_url', 'derniere_connexion', 'actif'],
        order: [['nom', 'ASC'], ['prenom', 'ASC']],
        limit: 100
      });
      console.log(`📊 ${allUsers.length} utilisateur(s) trouvé(s) sans condition actif`);
      console.log('📊 Exemples d\'utilisateurs:', allUsers.slice(0, 3).map(u => ({ id: u.id, nom: u.nom, prenom: u.prenom, actif: u.actif })));
      
      // Filtrer manuellement les utilisateurs actifs
      users = allUsers.filter(u => u.actif === true || u.actif === 1 || u.actif === null);
      console.log(`✅ ${users.length} utilisateur(s) actif(s) après filtrage manuel`);
    } else {
      console.log(`✅ ${users.length} utilisateur(s) trouvé(s) avec condition actif`);
    }

    // Formater les utilisateurs pour le frontend
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const formattedUsers = users.map(user => {
      const lastConnection = user.derniere_connexion ? new Date(user.derniere_connexion) : null;
      
      // Déterminer le statut
      let status = 'offline';
      let lastSeen = 'Jamais connecté';
      
      if (lastConnection) {
        if (lastConnection > fiveMinutesAgo) {
          status = 'online';
          lastSeen = 'En ligne';
        } else if (lastConnection > oneHourAgo) {
          status = 'away';
          const minutesAgo = Math.floor((now - lastConnection) / (60 * 1000));
          lastSeen = `Il y a ${minutesAgo} minute${minutesAgo > 1 ? 's' : ''}`;
        } else if (lastConnection > oneDayAgo) {
          status = 'away';
          const hoursAgo = Math.floor((now - lastConnection) / (60 * 60 * 1000));
          lastSeen = `Il y a ${hoursAgo} heure${hoursAgo > 1 ? 's' : ''}`;
        } else {
          status = 'offline';
          lastSeen = lastConnection.toLocaleDateString('fr-FR', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
      }

      return {
        id: user.id,
        prenom: user.prenom,
        nom: user.nom,
        email: user.email,
        role: user.role,
        photo_url: user.photo_url,
        status: status,
        lastSeen: lastSeen,
        derniere_connexion: user.derniere_connexion
      };
    });

    res.json({
      success: true,
      data: formattedUsers
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des utilisateurs'
    });
  }
});

module.exports = router;

