'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('GardenTransactionLists', 'mosaic_id', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: '',
    });
    await queryInterface.addColumn('GardenTransactionLists', 'hash', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: '',
    });
    await queryInterface.addColumn('GardenTransactionLists', 'mosaic_num', {
      type: Sequelize.DOUBLE(16,6),
      allowNull: false,
      defaultValue: 0,
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('GardenTransactionLists', 'mosaic_id');
    await queryInterface.removeColumn('GardenTransactionLists', 'hash');
    await queryInterface.removeColumn('GardenTransactionLists', 'mosaic_num');
  }
};
