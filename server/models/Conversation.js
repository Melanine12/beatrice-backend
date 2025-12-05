const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Conversation = sequelize.define('Conversation', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    user1_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID du premier utilisateur'
    },
    user2_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID du deuxième utilisateur'
    },
    last_message_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID du dernier message'
    },
    last_message_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date du dernier message'
    },
    user1_unread_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Nombre de messages non lus pour user1'
    },
    user2_unread_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Nombre de messages non lus pour user2'
    }
  }, {
    tableName: 'tbl_conversations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['user1_id', 'user2_id'],
        name: 'unique_conversation'
      },
      {
        fields: ['user1_id'],
        name: 'idx_user1_id'
      },
      {
        fields: ['user2_id'],
        name: 'idx_user2_id'
      },
      {
        fields: ['last_message_at'],
        name: 'idx_last_message_at'
      }
    ]
  });

  Conversation.associate = (models) => {
    Conversation.belongsTo(models.User, {
      foreignKey: 'user1_id',
      as: 'user1',
      onDelete: 'CASCADE'
    });
    
    Conversation.belongsTo(models.User, {
      foreignKey: 'user2_id',
      as: 'user2',
      onDelete: 'CASCADE'
    });
    
    Conversation.belongsTo(models.Message, {
      foreignKey: 'last_message_id',
      as: 'lastMessage',
      onDelete: 'SET NULL'
    });
    
    Conversation.hasMany(models.Message, {
      foreignKey: 'conversation_id',
      as: 'messages',
      onDelete: 'CASCADE'
    });
  };

  return Conversation;
};

