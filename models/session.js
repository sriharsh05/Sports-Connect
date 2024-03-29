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

      Session.hasMany(models.Usersession,{
        foreignKey: "sessionId",
      });
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

    static findPrevSessionsBySportId({sportid,userId}) {
      return this.findAll({
        where: {
          sportname: sportid,
          time: {
            [Op.lt]: new Date(),
          },
        },
      });
    }

    static findSessionById(id) {
      return this.findByPk(id);
    }

    static updateSession({sportname,time,address,playernames,playerscount,sessionid}){
      return this.update({
        sportname,
          time,
          address,
          playernames,
          playerscount,
        },
        { where: { id: sessionid } });
    }

    static cancelSession({sessionid,sessioncreated,reason}){
      return this.update({
        sessioncreated,
        reason,
        },
        { where: { id: sessionid } });
    }

    static async removeSport({sportId}) {
      return this.destroy({
        where: {
          sportname:sportId,
        },
      });
    }

    static findTotalSessionsBySportId({sportid,userId}) {
      return this.findAll({
        where: {
          sportname: sportid,
        },
      });
    }

    static findFutureSessionsBySportId({sportid,userId}) {
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

    static findPastSessionsBySportId({sportid,userId}) {
      return this.findAll({
        where: {
          sportname: sportid,
          sessioncreated: true,
          time: {
            [Op.lt]: new Date(),
          },
        },
      });
    }

    static findCanceledSessionsBySportId({sportid,userId}) {
      return this.findAll({
        where: {
          sportname: sportid,
          sessioncreated: false,
        },
      });
    }

  }
  Session.init({
    sportname: DataTypes.INTEGER,
    time: DataTypes.DATE,
    address: DataTypes.STRING,
    playernames: DataTypes.ARRAY(DataTypes.STRING),
    playerscount: DataTypes.INTEGER,
    sessioncreated: DataTypes.BOOLEAN,
    reason: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'Session',
  });
  return Session;
};