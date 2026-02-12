// src/services/animationFixer.js
const { ANIMATION_KEYWORDS_TO_REMOVE } = require('../utils/constants');
const logger = require('../utils/logger');

/**
 * Deep-scan and remove all head smooth / query-based rotation from any JSON object.
 * Covers: bone "head" rotation, any rotation using query.*rotation or query.target_x_rotation.
 * @param {object} obj - Any parsed JSON object or sub-object
 */
function removeHeadSmooth(obj) {
  if (typeof obj !== 'object' || obj === null) return;

  for (const key in obj) {
    const value = obj[key];

    // If bone is named "head" → zero out its rotation
    if (key === 'head' && typeof value === 'object' && value !== null) {
      if (value.rotation !== undefined) {
        logger.info('Removed head bone rotation (query-based)');
        value.rotation = [0, 0, 0];
      }
      // Also clear min/max rotation on head bone
      if (value.min_rotation) delete value.min_rotation;
      if (value.max_rotation) delete value.max_rotation;
    }

    // If any rotation array contains a query.*rotation expression → zero it out
    if (key === 'rotation') {
      const HEAD_QUERY_PATTERNS = [
        'query.target_x_rotation',
        'query.head_x_rotation',
        'query.target_y_rotation',
        'query.head_y_rotation',
        'query.body_x_rotation',
        'query.body_y_rotation',
      ];
      const isArray = Array.isArray(value);
      const isString = typeof value === 'string';

      const containsHeadQuery = (
        (isArray && value.some(v => typeof v === 'string' && HEAD_QUERY_PATTERNS.some(p => v.includes(p)))) ||
        (isString && HEAD_QUERY_PATTERNS.some(p => value.includes(p)))
      );

      if (containsHeadQuery) {
        logger.info(`Zeroed out query-based rotation: ${JSON.stringify(value)}`);
        obj[key] = [0, 0, 0];
        continue; // no need to recurse into the zeroed value
      }
    }

    // Recurse into nested objects/arrays
    if (typeof value === 'object') {
      removeHeadSmooth(value);
    }
  }
}

/**
 * Remove geometry.*.smooth references — replace with non-smooth equivalent.
 * e.g. "geometry.starstore.skin.head.smooth" → "geometry.starstore.skin.head"
 * @param {object} obj - Any parsed JSON object
 */
function removeGeometrySmooth(obj) {
  if (typeof obj !== 'object' || obj === null) return;

  for (const key in obj) {
    const value = obj[key];

    if (typeof value === 'string' && value.includes('geometry.') && value.includes('smooth')) {
      obj[key] = value.replace(/\.smooth/gi, '');
      logger.info(`Replaced smooth geometry: ${value} → ${obj[key]}`);
    } else if (typeof value === 'object') {
      removeGeometrySmooth(value);
    }
  }
}

/**
 * Remove smoothHeadX/Y/Z variables from scripts.initialize and scripts.pre_animation,
 * remove "head.smooth" entries from scripts.animate,
 * and remove "head.smooth" keys from the animations object.
 * @param {object} json - Any parsed JSON object
 */
function removeSmoothHeadScripts(json) {
  if (typeof json !== 'object' || json === null) return;

  const SMOOTH_VAR_PATTERNS = [
    'smoothhead', 'smooth_head', 'v.smoothhead', 'v.smooth_head',
    'targetsmoothhead', 'smoothdelta'
  ];
  const SMOOTH_ANIM_PATTERNS = [
    'head.smooth', 'smooth_head', 'smooth_rotation'
  ];

  for (const key in json) {
    const value = json[key];

    // Clean scripts.initialize — same as pre_animation
    if (key === 'initialize' && Array.isArray(value)) {
      const before = value.length;
      json[key] = value.filter(expr => {
        if (typeof expr !== 'string') return true;
        const lower = expr.toLowerCase();
        const shouldRemove = SMOOTH_VAR_PATTERNS.some(p => lower.includes(p));
        if (shouldRemove) logger.info(`Removed smooth head initialize script: ${expr}`);
        return !shouldRemove;
      });
      if (json[key].length === 0 && before > 0) delete json[key];
    }

    // Clean scripts.pre_animation
    if (key === 'pre_animation' && Array.isArray(value)) {
      const before = value.length;
      json[key] = value.filter(expr => {
        if (typeof expr !== 'string') return true;
        const lower = expr.toLowerCase();
        const shouldRemove = SMOOTH_VAR_PATTERNS.some(p => lower.includes(p));
        if (shouldRemove) logger.info(`Removed smooth head pre_animation script: ${expr}`);
        return !shouldRemove;
      });
      if (json[key].length === 0 && before > 0) delete json[key];
    }

    // Clean scripts.animate — remove "head.smooth" entries
    if (key === 'animate' && Array.isArray(value)) {
      json[key] = value.filter(entry => {
        const name = typeof entry === 'string' ? entry : Object.keys(entry)[0] || '';
        const shouldRemove = SMOOTH_ANIM_PATTERNS.some(p => name.toLowerCase().includes(p));
        if (shouldRemove) logger.info(`Removed smooth animate entry: ${name}`);
        return !shouldRemove;
      });
    }

    // Clean animations object — remove keys like "head.smooth"
    if (key === 'animations' && typeof value === 'object' && !Array.isArray(value)) {
      Object.keys(value).forEach(animKey => {
        const shouldRemove = SMOOTH_ANIM_PATTERNS.some(p => animKey.toLowerCase().includes(p));
        if (shouldRemove) {
          logger.info(`Removed smooth animation key: ${animKey}`);
          delete value[animKey];
        }
      });
    }

    // Recurse
    if (typeof value === 'object') {
      removeSmoothHeadScripts(value);
    }
  }
}

/**
 * Remove unwanted head animations and rotation limits from animation JSON.
 * @param {object} json - Parsed animation file content
 * @returns {object} Modified JSON
 */
function fixAnimationFile(json) {
  // Pass 1: keyword-based removal (animation / controller names)
  if (json.animations && typeof json.animations === 'object') {
    Object.keys(json.animations).forEach(animKey => {
      const anim = json.animations[animKey];
      if (ANIMATION_KEYWORDS_TO_REMOVE.some(keyword => animKey.toLowerCase().includes(keyword))) {
        delete json.animations[animKey];
        logger.info(`Removed animation: ${animKey}`);
        return;
      }
      // Remove bone rotation limits
      if (anim.bones && typeof anim.bones === 'object') {
        Object.keys(anim.bones).forEach(boneName => {
          const bone = anim.bones[boneName];
          if (bone.min_rotation) delete bone.min_rotation;
          if (bone.max_rotation) delete bone.max_rotation;
        });
      }
    });
  }

  if (json.animation_controllers && typeof json.animation_controllers === 'object') {
    Object.keys(json.animation_controllers).forEach(ctrlKey => {
      const ctrl = json.animation_controllers[ctrlKey];
      if (ANIMATION_KEYWORDS_TO_REMOVE.some(keyword => ctrlKey.toLowerCase().includes(keyword))) {
        delete json.animation_controllers[ctrlKey];
        logger.info(`Removed animation controller: ${ctrlKey}`);
      } else {
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

  // Pass 2: deep-scan for any leftover query-based head rotation
  removeHeadSmooth(json);

  // Pass 3: replace smooth geometry references
  removeGeometrySmooth(json);

  // Pass 4: remove smoothHeadX/Y/Z script variables
  removeSmoothHeadScripts(json);

  return json;
}

module.exports = { fixAnimationFile, removeHeadSmooth, removeGeometrySmooth, removeSmoothHeadScripts };