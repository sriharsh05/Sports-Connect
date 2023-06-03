'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Sport extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Sport.belongsTo(models.User,{
        foreignKey: 'userId',
      })
    }
    static addSport({ name, userId }) {
      return this.create({
       name: name,
       userId,
      });
    }

    static getAllSports(userId){
      return this.findAll();
    }

  }
  Sport.init({
    name: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Sport',
  });
  return Sport;
};