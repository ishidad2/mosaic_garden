'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */
    const now = new Date();
    await queryInterface.bulkInsert('GardenBlackMosaicLists',[
      {mosaic_id: '3A8416DB2D53B6C8', createdAt: now, updatedAt: now},
      {mosaic_id: '6BED913FA20223F8', createdAt: now, updatedAt: now},
    ], []); 
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('GardenBlackMosaicLists', null, {});
  }
};
