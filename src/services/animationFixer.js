// src/services/animationFixer.js
const { ANIMATION_KEYWORDS_TO_REMOVE } = require('../utils/constants');
const logger = require('../utils/logger');

/**
 * Remove unwanted head animations and rotation limits from animation JSON.
 * @param {object} json - Parsed animation file content
 * @returns {object} Modified JSON
 */
function fixAnimationFile(json) {
  // Handle animations object
  if (json.animations && typeof json.animations === 'object') {
    Object.keys(json.animations).forEach(animKey => {
      const anim = json.animations[animKey];
      // Remove entire animation if name contains unwanted keyword
      if (ANIMATION_KEYWORDS_TO_REMOVE.some(keyword => animKey.toLowerCase().includes(keyword))) {
        delete json.animations[animKey];
        logger.info(`Removed animation: ${animKey}`);
        return;
      }

      // Remove bone rotation limits (min_rotation, max_rotation) in bones
      if (anim.bones && typeof anim.bones === 'object') {
        Object.keys(anim.bones).forEach(boneName => {
          const bone = anim.bones[boneName];
          if (bone.min_rotation) delete bone.min_rotation;
          if (bone.max_rotation) delete bone.max_rotation;
        });
      }
    });
  }

  // Handle animation controllers
  if (json.animation_controllers && typeof json.animation_controllers === 'object') {
    Object.keys(json.animation_controllers).forEach(ctrlKey => {
      const ctrl = json.animation_controllers[ctrlKey];
      // Remove controller if it's head-related
      if (ANIMATION_KEYWORDS_TO_REMOVE.some(keyword => ctrlKey.toLowerCase().includes(keyword))) {
        delete json.animation_controllers[ctrlKey];
        logger.info(`Removed animation controller: ${ctrlKey}`);
      } else {
        // Remove states that reference head animations
        if (ctrl.states && typeof ctrl.states === 'object') {
          Object.keys(ctrl.states).forEach(stateKey => {
            const state = ctrl.states[stateKey];
            if (state.animations && Array.isArray(state.animations)) {
              state.animations = state.animations.filter(anim => {
                const shouldRemove = ANIMATION_KEYWORDS_TO_REMOVE.some(
                  keyword => typeof anim === 'string' && anim.toLowerCase().includes(keyword)
                );
                if (shouldRemove) logger.info(`Removed animation reference: ${anim}`);
                return !shouldRemove;
              });
            }
          });
        }
      }
    });
  }

  return json;
}

module.exports = { fixAnimationFile };