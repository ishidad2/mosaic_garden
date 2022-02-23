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
    await queryInterface.bulkInsert('GardenMessages',[
      {message_js: '【大吉】 勝負は時の運', message_en: '', createdAt: now, updatedAt: now},
      {message_js: '【大吉】 運が向く', message_en: '', createdAt: now, updatedAt: now},
      {message_js: '【吉】運命の赤い糸', message_en: '', createdAt: now, updatedAt: now},
      {message_js: '【吉】運根鈍', message_en: '', createdAt: now, updatedAt: now},
      {message_js: '【吉】馬に乗るとも口車には乗るな', message_en: '', createdAt: now, updatedAt: now},
      {message_js: '【吉】勝つも負けるも時の運', message_en: '', createdAt: now, updatedAt: now},
      {message_js: '【小吉】 運は天にあり', message_en: '', createdAt: now, updatedAt: now},
      {message_js: '【小吉】 運は寝て待て', message_en: '', createdAt: now, updatedAt: now},
      {message_js: '【小吉】 色気より食い気', message_en: '', createdAt: now, updatedAt: now},
      {message_js: '【小吉】 言いたいことは明日言え', message_en: '', createdAt: now, updatedAt: now},
      {message_js: '【小吉】 行きはよいよい帰りは怖い', message_en: '', createdAt: now, updatedAt: now},
      {message_js: '【笑吉】 当たるも八卦当たらぬも八卦', message_en: '', createdAt: now, updatedAt: now},
    ], []); 
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('GardenMessages', null, {});
  }
};
