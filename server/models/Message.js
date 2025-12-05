const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Message = sequelize.define('Message', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    conversation_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID de la conversation'
    },
    sender_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID de l\'expéditeur'
    },
    receiver_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID du destinataire'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Contenu du message'
    },
    message_type: {
      type: DataTypes.ENUM('text', 'image', 'file', 'system'),
      defaultValue: 'text',
      comment: 'Type de message'
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Message lu ou non'
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date de lecture'
    },
    file_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'URL du fichier si message_type est file ou image'
    },
    file_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Nom du fichier'
    }
  }, {
    tableName: 'tbl_messages',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['conversation_id'],
        name: 'idx_conversation_id'
      },
      {
        fields: ['sender_id'],
        name: 'idx_sender_id'
      },
      {
        fields: ['receiver_id'],
        name: 'idx_receiver_id'
      },
      {
        fields: ['created_at'],
        name: 'idx_created_at'
      },
      {
        fields: ['is_read'],
        name: 'idx_is_read'
      }
    ]
  });

  Message.associate = (models) => {
    Message.belongsTo(models.Conversation, {
      foreignKey: 'conversation_id',
      as: 'conversation',
      onDelete: 'CASCADE'
    });
    
    Message.belongsTo(models.User, {
      foreignKey: 'sender_id',
      as: 'sender',
      onDelete: 'CASCADE'
    });
    
    Message.belongsTo(models.User, {
      foreignKey: 'receiver_id',
      as: 'receiver',
      onDelete: 'CASCADE'
    });
  };

  return Message;
};

