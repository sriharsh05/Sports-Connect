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

      Sport.hasMany(models.Usersession,{
        foreignKey: "sportId",
      });
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

    static async remove(id) {
      return this.destroy({
        where: {
          id,
        },
      });
    }

    static findSportById(id, userId) {
      return this.findByPk(id);
    }

    static async updateSport(name, id) {
      return this.update({ name: name },
        { where: { id: id } });
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