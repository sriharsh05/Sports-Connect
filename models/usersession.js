'use strict';
const {
  Model,Op
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Usersession extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Usersession.belongsTo(models.User,{
        foreignKey: 'userId',
      })

      Usersession.belongsTo(models.Session,{
        foreignKey: 'sessionId',
      })
    }

    static addUserSession({ username, userId, sessionId }) {
      return this.create({
        username,
        userId,
        sessionId,
      });
    }

    static removeUserSession({ userId }) {
      return this.destroy({
        where: {
          userId,
        },
      });
    }

    static getPlayers({ sessionId }) {
      return this.findAll({ where: { sessionId } });
    }

    static async remove(id) {
      return this.destroy({
        where: {
          id,
        },
      });
    }

    static getJoinedSessions({userId}){
      return this.findAll({
        where: {
          userId,
        },
         } );
    }


  }
  Usersession.init({
    username: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Usersession',
  });
  return Usersession;
};