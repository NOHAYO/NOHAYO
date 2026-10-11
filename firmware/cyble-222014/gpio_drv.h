/*******************************************************************************
* File: gpio_drv.h
*
* Register-level GPIO driver for PSoC 4 BLE (CY8C4248LQI-BL583 /
* CYBLE-222014-01). Use it for pins that are NOT placed as Pin components in
* TopDesign.cysch. PSoC Creator leaves those pins as plain GPIO and the
* firmware owns them.
*******************************************************************************/
#ifndef GPIO_DRV_H
#define GPIO_DRV_H

#include <project.h>   /* PSoC Creator: CyLib.h, cydevice_trm.h, cytypes.h */

/* A pin is packed into one byte: high nibble = port, low nibble = pin. */
typedef uint8 gpio_pin_t;

#define GPIO_PIN(port, pin)   ((gpio_pin_t)((((port) & 0x0Fu) << 4u) | ((pin) & 0x07u)))
#define GPIO_PORT_OF(p)       ((uint32)((p) >> 4u))
#define GPIO_PIN_OF(p)        ((uint32)((p) & 0x07u))

/* Drive modes: these are the 3-bit values of the GPIO_PRTx_PC register. */
typedef enum
{
    GPIO_DM_ANALOG       = 0u,  /* Hi-Z, input buffer off (analog / unused)  */
    GPIO_DM_INPUT        = 1u,  /* Hi-Z digital input                        */
    GPIO_DM_PULLUP       = 2u,  /* resistive pull-up   (set DR=1)            */
    GPIO_DM_PULLDOWN     = 3u,  /* resistive pull-down (set DR=0)            */
    GPIO_DM_OD_LOW       = 4u,  /* open drain, drives low                    */
    GPIO_DM_OD_HIGH      = 5u,  /* open drain, drives high                   */
    GPIO_DM_STRONG       = 6u,  /* push-pull output                          */
    GPIO_DM_PULLUP_DOWN  = 7u
} gpio_drive_t;

/* Edge selection: 2-bit values of GPIO_PRTx_INTR_CFG. */
typedef enum
{
    GPIO_IRQ_NONE    = 0u,
    GPIO_IRQ_RISING  = 1u,
    GPIO_IRQ_FALLING = 2u,
    GPIO_IRQ_BOTH    = 3u
} gpio_edge_t;

/* Route the pin to firmware GPIO (HSIOM), write the initial output level, then
 * set the drive mode. The output never glitches to the wrong level. */
void  gpio_init(gpio_pin_t p, gpio_drive_t mode, uint8 initial);

void  gpio_set_drive_mode(gpio_pin_t p, gpio_drive_t mode);
void  gpio_write(gpio_pin_t p, uint8 value);
void  gpio_toggle(gpio_pin_t p);
uint8 gpio_read(gpio_pin_t p);        /* pin state (PS register) */

/* Edge interrupts. Pins on one port share one NVIC line. */
void  gpio_irq_config(gpio_pin_t p, gpio_edge_t edge);
uint8 gpio_irq_pending(gpio_pin_t p);
void  gpio_irq_clear(gpio_pin_t p);

#endif /* GPIO_DRV_H */
