'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class GardenBlackMosaicLists extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  GardenBlackMosaicLists.init({
    mosaic_id: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'GardenBlackMosaicLists',
  });
  return GardenBlackMosaicLists;
};