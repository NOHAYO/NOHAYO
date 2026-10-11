/*******************************************************************************
* File: board.h
*
* Board support for the CYBLE-222014-01 (U12) section of the schematic.
*******************************************************************************/
#ifndef BOARD_H
#define BOARD_H

#include "board_pins.h"

typedef enum { LED1 = 0u, LED2, LED3, LED_COUNT } board_led_t;

/* Configure every board pin to a safe default state. Call this once at the
 * start of main(), before CyGlobalIntEnable and before starting components.
 *   - LEDs off, KOUT inactive, SHDN_Pwr inactive
 *   - BOOT0 low (normal boot), NRST released (open drain, Hi-Z)
 *   - PMIC_INT input with pull-up and a falling-edge IRQ
 *   - unused pads set to analog Hi-Z (lowest leakage) */
void  board_init(void);

void  board_led_set(board_led_t led, uint8 on);
void  board_led_toggle(board_led_t led);

void  board_kout_set(uint8 active);
void  board_shdn_pwr_set(uint8 active);

/* Host MCU control over BOOT0 / NRST */
void  board_host_reset(void);              /* pulse NRST low, normal boot     */
void  board_host_enter_bootloader(void);   /* BOOT0 high while reset released */

uint8 board_pmic_int_asserted(void);       /* 1 while PMIC_INT is low         */

/* Set to 1 by the PMIC_INT ISR. The application clears it. */
extern volatile uint8 board_pmic_event;

#endif /* BOARD_H */
