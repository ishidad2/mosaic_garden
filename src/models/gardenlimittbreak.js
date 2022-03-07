'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class GardenLimittBreak extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  GardenLimittBreak.init({
    mosaic_id: DataTypes.STRING,
    num: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'GardenLimittBreak',
  });
  return GardenLimittBreak;
};