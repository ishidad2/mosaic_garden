'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class GardenTransactionLists extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

    /**
     * トランザクション履歴を取得
     * @param {*} address 
     * @returns 
    */
    static async last(address){
      return await this.findAll({
        where: { 
          address: address,
        },
        order: [
          ['id', 'DESC']
        ],
        limit: 1
      });
    }
  }
  GardenTransactionLists.init({
    address: DataTypes.STRING,
    mosaic_id: DataTypes.STRING,
    hash: DataTypes.STRING,
    mosaic_num: DataTypes.DOUBLE,
  }, {
    sequelize,
    modelName: 'GardenTransactionLists',
  });
  return GardenTransactionLists;
};