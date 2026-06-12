/**
 * ============================================================
 * ExpressionController
 * ============================================================
 *
 * Traduce expresiones abstractas de LESCO
 * a parámetros reales del avatar.
 *
 * Este controlador permite cambiar de avatar
 * sin modificar las expresiones.
 *
 * Solo habría que cambiar el PARAMETER_MAP.
 * ============================================================
 */

import { LESCO_EXPRESSIONS } from "./lescoExpressions";

/**
 * ------------------------------------------------------------
 * Mapeo de parámetros reales del avatar
 * ------------------------------------------------------------
 *
 * Ajustar según los parámetros encontrados
 * en cada modelo Inochi.
 */
const PARAMETER_MAP = {
  mouth: "Face::Mouth-Opened",

  head: "Head::Yaw-Pitch",

  blink: "Eyes::Blink",

  eyebrows: null,

  smile: null,
};

/**
 * ============================================================
 * Clase principal
 * ============================================================
 */
export class ExpressionController {
  constructor(viewer) {
    /**
     * Referencia al InochiViewer
     */
    this.viewer = viewer;

    /**
     * Expresión actual
     */
    this.currentExpression = "neutral";

    /**
     * Control de animación de negación
     */
    this.shakeInterval = null;
  }

  /**
   * ============================================================
   * Aplicar una expresión
   * ============================================================
   */
  apply(expressionName) {
    const expression = LESCO_EXPRESSIONS[expressionName];

    if (!expression) {
      console.warn(
        `Expresión '${expressionName}' no encontrada`
      );
      return;
    }

    this.currentExpression = expressionName;

    /**
     * ----------------------------------------------------------
     * Boca
     * ----------------------------------------------------------
     */
    if (
      PARAMETER_MAP.mouth &&
      expression.mouth !== undefined
    ) {
      this.viewer.set_param(
        PARAMETER_MAP.mouth,
        expression.mouth,
        0
      );
    }

    /**
     * ----------------------------------------------------------
     * Cabeza
     * ----------------------------------------------------------
     */
    if (
      PARAMETER_MAP.head &&
      expression.headX !== undefined
    ) {
      this.viewer.set_param(
        PARAMETER_MAP.head,
        expression.headX,
        expression.headY || 0
      );
    }

    /**
     * ----------------------------------------------------------
     * Futuras cejas
     * ----------------------------------------------------------
     */
    if (
      PARAMETER_MAP.eyebrows &&
      expression.eyebrows !== undefined
    ) {
      this.viewer.set_param(
        PARAMETER_MAP.eyebrows,
        expression.eyebrows,
        0
      );
    }

    /**
     * ----------------------------------------------------------
     * Futuras sonrisas
     * ----------------------------------------------------------
     */
    if (
      PARAMETER_MAP.smile &&
      expression.smile !== undefined
    ) {
      this.viewer.set_param(
        PARAMETER_MAP.smile,
        expression.smile,
        0
      );
    }

    /**
     * ----------------------------------------------------------
     * Negación
     * ----------------------------------------------------------
     */
    if (expression.headShake) {
      this.startHeadShake();
    } else {
      this.stopHeadShake();
    }
  }

  /**
   * ============================================================
   * Animación de negación
   * ============================================================
   *
   * Movimiento:
   *
   * izquierda → derecha → izquierda
   */
  startHeadShake() {
    this.stopHeadShake();

    let dir = 1;

    this.shakeInterval = setInterval(() => {
      this.viewer.set_param(
        PARAMETER_MAP.head,
        0.35 * dir,
        0
      );

      dir *= -1;
    }, 200);
  }

  /**
   * ============================================================
   * Detener negación
   * ============================================================
   */
  stopHeadShake() {
    if (this.shakeInterval) {
      clearInterval(this.shakeInterval);
      this.shakeInterval = null;
    }
  }

  /**
   * ============================================================
   * Volver a estado neutro
   * ============================================================
   */
  reset() {
    this.apply("neutral");
  }
}