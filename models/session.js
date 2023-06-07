'use strict';
const {
  Model,
  Op
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Session extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Session.belongsTo(models.User,{
        foreignKey: 'userId'
      }) 
    }

    static createSession({sportname,time,address,playernames,playerscount,sessioncreated,userId,}) {
      return this.create({
        sportname,
          time,
          address,
          playernames,
          playerscount,
          sessioncreated,
          userId,
      });
    }

    static findSessionsBySportId({sportid,userId}) {
      return this.findAll({
        where: {
          sportname: sportid,
          sessioncreated: true,
          time: {
            [Op.gt]: new Date(),
          },
        },
      });
    }

    static findSessionById(id) {
      return this.findByPk(id);
    }

  }
  Session.init({
    sportname: DataTypes.INTEGER,
    time: DataTypes.DATE,
    address: DataTypes.STRING,
    playernames: DataTypes.ARRAY(DataTypes.STRING),
    playerscount: DataTypes.INTEGER,
    sessioncreated: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Session',
  });
  return Session;
};