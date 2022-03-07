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
     await queryInterface.bulkInsert('GardenLimittBreaks',[
       {mosaic_id: '6F4018163AC51F88', num: 1, createdAt: now, updatedAt: now},
     ], []); 
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
     await queryInterface.bulkDelete('GardenLimittBreaks', null, {});

  }
};
