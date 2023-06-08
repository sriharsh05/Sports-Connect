'use strict';
const {
  Model
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

    static addUserSession({ username, sessionId }) {
      return this.create({
        username,
        sessionId,
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

  }
  Usersession.init({
    username: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Usersession',
  });
  return Usersession;
};