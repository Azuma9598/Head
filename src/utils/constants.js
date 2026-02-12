// src/utils/constants.js
module.exports = {
  ALLOWED_EXTENSIONS: ['.zip', '.mcaddon', '.mcpack'],
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || 104857600, // 100MB
  TMP_PREFIX: 'mc-fixer-',
  FIXED_PREFIX: 'FIXED_',
  ANIMATION_KEYWORDS_TO_REMOVE: [
    'head_follow',
    'smooth_rotation',
    'smooth_head',
    'look_at_player'
  ],
  RENDER_CONTROLLER_PRESERVE: [
    'controller.animation.player.render',
    'controller.render.armor_stand'
  ]
};