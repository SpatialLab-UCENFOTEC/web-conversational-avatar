/**
 * ============================================================
 * LESCO EXPRESSIONS
 * ============================================================
 *
 * Este archivo define las expresiones faciales utilizadas
 * durante la comunicación en Lengua de Señas Costarricense.
 *
 * IMPORTANTE:
 * Aquí NO se usan parámetros específicos del avatar.
 *
 * Este archivo únicamente define la intención de la expresión.
 *
 * Luego ExpressionController será quien traduzca estas
 * expresiones a parámetros reales del modelo Inochi.
 *
 * De esta forma el sistema es reutilizable para futuros
 * avatares sin modificar la lógica.
 * ============================================================
 */

export const LESCO_EXPRESSIONS = {
  /**
   * ------------------------------------------------------------
   * Estado neutro
   * ------------------------------------------------------------
   * Expresión facial normal.
   */
  neutral: {
    headX: 0,
    headY: 0,

    mouth: 0.8,

    eyesOpen: 0.5,

    eyebrows: 0,

    smile: 0,
  },

  /**
   * ------------------------------------------------------------
   * Escuchando
   * ------------------------------------------------------------
   * Cabeza ligeramente inclinada para mostrar atención.
   */
  listening: {
    headX: 0.35,
    headY: 0.10,

    mouth: 0.82,

    eyesOpen: 0.65,

    eyebrows: 0.1,

    smile: 0,
  },

  /**
   * ------------------------------------------------------------
   * Pregunta SI / NO
   * ------------------------------------------------------------
   * En LESCO normalmente se levantan las cejas.
   */
  questionYesNo: {
    headX: 0,

    eyebrows: 1,

    eyesOpen: 0.8,

    mouth: 0.8,

    smile: 0,
  },

  /**
   * ------------------------------------------------------------
   * Pregunta abierta
   * ------------------------------------------------------------
   * Qué, quién, dónde, cuándo...
   *
   * Generalmente las cejas se fruncen.
   */
  questionOpen: {
    headX: 0,

    eyebrows: -1,

    eyesOpen: 0.6,

    mouth: 0.8,

    smile: 0,
  },

  /**
   * ------------------------------------------------------------
   * Énfasis
   * ------------------------------------------------------------
   * Se usa para reforzar una idea importante.
   */
  emphasis: {
    eyesOpen: 1,

    eyebrows: 0.4,

    mouth: 0.85,

    headX: 0,
  },

  /**
   * ------------------------------------------------------------
   * Duda / precisión
   * ------------------------------------------------------------
   */
  doubt: {
    eyesOpen: 0.25,

    eyebrows: -0.3,

    mouth: 0.8,

    headX: 0.15,
  },

  /**
   * ------------------------------------------------------------
   * Afirmación
   * ------------------------------------------------------------
   */
  affirmative: {
    smile: 1,

    eyebrows: 0.3,

    eyesOpen: 0.7,

    mouth: 0.8,
  },

  /**
   * ------------------------------------------------------------
   * Negación
   * ------------------------------------------------------------
   *
   * El movimiento de cabeza se realizará mediante
   * una animación en ExpressionController.
   */
  negative: {
    headShake: true,

    eyebrows: -0.2,

    mouth: 0.8,
  },

  /**
   * ------------------------------------------------------------
   * Sorpresa
   * ------------------------------------------------------------
   */
  surprise: {
    eyesOpen: 1,

    eyebrows: 1,

    mouth: 0.95,
  },
};