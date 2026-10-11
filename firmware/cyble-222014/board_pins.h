/*******************************************************************************
* File: board_pins.h
*
* Pin map for U12 = CYBLE-222014-01 (EZ-BLE module, CY8C4248LQI-BL583 inside).
* Taken from the board schematic. Every board net is defined here only, so if
* the schematic changes, this is the only file to edit.
*
*  Module pad | Port  | Net        | Direction / use
*  -----------+-------+------------+-------------------------------------------
*      1      |  -    | GND        |
*      2      | P4.1  | BOOT0      | out, push-pull   (host MCU boot select)
*      3      | P5.1  | UI_LED3    | out, push-pull
*      4      | P5.0  | NRST       | out, open-drain low (host MCU reset)
*      5      |  -    | VDDR       | supply
*      6      |  -    | Vref       | (VREF, C58 2.2uF)
*      7      | P1.6  | PMIC_INT   | in, pull-up, falling-edge interrupt
*      8      | P0.7  | SWDCLK     | debug - DO NOT reconfigure
*      9      | P0.4  | UI_LED2    | out, push-pull (TP57)
*     10      | P0.5  | (n.c.)     | unused -> analog Hi-Z
*     11      |  -    | GND        |
*     12      | P0.6  | SWDIO      | debug - DO NOT reconfigure
*     13      | P1.7  | UI_LED1    | out, push-pull
*     14      |  -    | VDD        | 1V8
*     15      | XRES  | XRES       | dedicated reset pin (R41 22k / C62)
*     16      | P3.5  | SCL        | SCB1 I2C SCL  (TP15)
*     17      | P3.4  | SDA        | SCB1 I2C SDA  (TP14)
*     18      | P3.7  | VMon       | analog in -> SAR ADC (C61 100nF, TP13)
*     19      | P1.4  | SCB1_RX    | UART RX (TP9)
*     20      | P1.5  | SCB1_TX    | UART TX (TP12)
*     21      | P3.6  | KOUT       | out, push-pull (TP11)
*     22      | P4.0  | SHDN_Pwr   | out, push-pull (TP10)
*
* CHECK AGAINST THE SCHEMATIC (the screenshot was ambiguous here):
*   - PMIC_INT / UI_LED2 / n.c. are pads 7, 9, 10 in some order.
*   - VMon / SDA / SCL are pads 18, 17, 16 in some order. The order above is
*     the one the hardware supports: on this chip SCB1 I2C is fixed to
*     P3.4 = SDA / P3.5 = SCL, and SAR ADC inputs are on port 3.
*   - Active levels of the LEDs, SHDN_Pwr and KOUT are not shown on this sheet.
*     Set them in the "Active levels" section below.
*******************************************************************************/
#ifndef BOARD_PINS_H
#define BOARD_PINS_H

#include "gpio_drv.h"

/* ---------------- Digital outputs ---------------- */
#define PIN_BOOT0        GPIO_PIN(4u, 1u)
#define PIN_NRST         GPIO_PIN(5u, 0u)
#define PIN_SHDN_PWR     GPIO_PIN(4u, 0u)
#define PIN_KOUT         GPIO_PIN(3u, 6u)
#define PIN_UI_LED1      GPIO_PIN(1u, 7u)
#define PIN_UI_LED2      GPIO_PIN(0u, 4u)
#define PIN_UI_LED3      GPIO_PIN(5u, 1u)

/* ---------------- Digital inputs ----------------- */
#define PIN_PMIC_INT     GPIO_PIN(1u, 6u)

/* ---------------- Analog ------------------------- */
#define PIN_VMON         GPIO_PIN(3u, 7u)

/* ---------------- Serial (routed by PSoC Creator SCB components) ---- */
#define PIN_I2C_SDA      GPIO_PIN(3u, 4u)
#define PIN_I2C_SCL      GPIO_PIN(3u, 5u)
#define PIN_UART_RX      GPIO_PIN(1u, 4u)
#define PIN_UART_TX      GPIO_PIN(1u, 5u)

/* ---------------- Debug (never touch) ------------ */
#define PIN_SWDIO        GPIO_PIN(0u, 6u)
#define PIN_SWDCLK       GPIO_PIN(0u, 7u)

/* ---------------- Unused ------------------------- */
#define PIN_NC_P0_5      GPIO_PIN(0u, 5u)

/* ---------------- Active levels ------------------ */
#define LED_ACTIVE_LEVEL       (1u)   /* 1 = LED lit when pin high          */
#define SHDN_PWR_ACTIVE_LEVEL  (1u)   /* level that asserts shutdown        */
#define KOUT_ACTIVE_LEVEL      (1u)
#define BOOT0_ACTIVE_LEVEL     (1u)   /* STM32-style: BOOT0=1 -> bootloader */
/* NRST is open-drain, active low: drive 0 = hold reset, 1 = release (Hi-Z). */

/* GPIO port interrupt line of PMIC_INT's port (port 1). On PSoC 4 BLE the
 * GPIO port interrupts are IRQ 0..4 = ports 0..4. Verify against
 * cydevice_trm.h / the device datasheet's interrupt table. */
#define PMIC_INT_IRQ_NUM       (1u)
#define PMIC_INT_IRQ_PRIORITY  (3u)

#endif /* BOARD_PINS_H */
