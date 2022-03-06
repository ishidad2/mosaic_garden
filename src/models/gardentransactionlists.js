'use strict';
const dayjs = require('dayjs');
const Sequelize = require("sequelize")
const { QueryTypes } = require('sequelize');
const Op = Sequelize.Op
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

    /**
     * 1日の総トランザクション数
     */
    static async todays_tx(){
      const today = dayjs();
      return await this.findAll({
        where: {
          createdAt: { [Op.between]: [today.format('YYYY-MM-DD 15:00:00'), today.add(1, 'day').format('YYYY-MM-DD 15:00:00')] }
        }
      });
    }

    /**
     * 1日の利用ユーザー
     */
     static async get_todays_users(){
      const today = dayjs();
      return sequelize.query(
        `SELECT count(DISTINCT address) as todays_count FROM GardenTransactionLists WHERE createdAt BETWEEN '${today.format('YYYY-MM-DD 15:00:00')}' AND '${today.add(1, 'day').format('YYYY-MM-DD 15:00:00')}'`,
        { type: QueryTypes.SELECT });
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