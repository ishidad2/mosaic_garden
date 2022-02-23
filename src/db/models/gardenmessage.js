'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class GardenMessage extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  GardenMessage.init({
    message_js: DataTypes.STRING,
    message_en: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'GardenMessage',
  });
  return GardenMessage;
};