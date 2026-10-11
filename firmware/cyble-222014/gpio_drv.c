/*******************************************************************************
* File: gpio_drv.c
*
* Register-level GPIO driver for PSoC 4 BLE. See gpio_drv.h.
*******************************************************************************/
#include "gpio_drv.h"

/* GPIO port register block (PSoC 4 BLE TRM, "GPIO_PRTx"). The addresses come
 * from cydevice_trm.h when PSoC Creator generates it. The fallbacks are the
 * PSoC 4 BLE values. */
#ifdef CYREG_PRT0_DR
    #define GPIO_PRT_BASE      ((uint32)CYREG_PRT0_DR)
    #define GPIO_PRT_STRIDE    ((uint32)CYREG_PRT1_DR - (uint32)CYREG_PRT0_DR)
#else
    #define GPIO_PRT_BASE      (0x40040000u)
    #define GPIO_PRT_STRIDE    (0x00000100u)
#endif

#ifdef CYREG_HSIOM_PORT_SEL0
    #define HSIOM_BASE         ((uint32)CYREG_HSIOM_PORT_SEL0)
    #define HSIOM_STRIDE       ((uint32)CYREG_HSIOM_PORT_SEL1 - (uint32)CYREG_HSIOM_PORT_SEL0)
#else
    #define HSIOM_BASE         (0x40010000u)
    #define HSIOM_STRIDE       (0x00000100u)
#endif

#define GPIO_DR_OFS            (0x00u)   /* output data          */
#define GPIO_PS_OFS            (0x04u)   /* pin state            */
#define GPIO_PC_OFS            (0x08u)   /* drive mode, 3b/pin   */
#define GPIO_INTR_CFG_OFS      (0x0Cu)   /* edge select, 2b/pin  */
#define GPIO_INTR_OFS          (0x10u)   /* int status, W1C      */

#define HSIOM_SEL_GPIO         (0x0u)    /* firmware-controlled  */

#define PRT_REG(p, ofs)  ((reg32 *)(GPIO_PRT_BASE + (GPIO_PORT_OF(p) * GPIO_PRT_STRIDE) + (ofs)))
#define HSIOM_REG(p)     ((reg32 *)(HSIOM_BASE    + (GPIO_PORT_OF(p) * HSIOM_STRIDE)))

/* Read-modify-write of a bit field, protected from interrupts. Other pins on
 * the same port may be driven from ISRs or by generated component code. */
static void reg_field_write(reg32 *reg, uint32 mask, uint32 value)
{
    uint8 cs = CyEnterCriticalSection();
    CY_SET_REG32(reg, (CY_GET_REG32(reg) & ~mask) | (value & mask));
    CyExitCriticalSection(cs);
}

void gpio_set_drive_mode(gpio_pin_t p, gpio_drive_t mode)
{
    uint32 shift = GPIO_PIN_OF(p) * 3u;
    reg_field_write(PRT_REG(p, GPIO_PC_OFS), (uint32)0x7u << shift, (uint32)mode << shift);
}

void gpio_write(gpio_pin_t p, uint8 value)
{
    uint32 bit = (uint32)1u << GPIO_PIN_OF(p);
    reg_field_write(PRT_REG(p, GPIO_DR_OFS), bit, (0u != value) ? bit : 0u);
}

void gpio_toggle(gpio_pin_t p)
{
    uint32 bit = (uint32)1u << GPIO_PIN_OF(p);
    reg32 *dr  = PRT_REG(p, GPIO_DR_OFS);
    uint8 cs   = CyEnterCriticalSection();
    CY_SET_REG32(dr, CY_GET_REG32(dr) ^ bit);
    CyExitCriticalSection(cs);
}

uint8 gpio_read(gpio_pin_t p)
{
    return (uint8)((CY_GET_REG32(PRT_REG(p, GPIO_PS_OFS)) >> GPIO_PIN_OF(p)) & 1u);
}

void gpio_init(gpio_pin_t p, gpio_drive_t mode, uint8 initial)
{
    uint32 hsiomShift = GPIO_PIN_OF(p) * 4u;

    gpio_write(p, initial);
    reg_field_write(HSIOM_REG(p), (uint32)0xFu << hsiomShift, (uint32)HSIOM_SEL_GPIO << hsiomShift);
    gpio_set_drive_mode(p, mode);
}

void gpio_irq_config(gpio_pin_t p, gpio_edge_t edge)
{
    uint32 shift = GPIO_PIN_OF(p) * 2u;

    gpio_irq_clear(p);
    reg_field_write(PRT_REG(p, GPIO_INTR_CFG_OFS), (uint32)0x3u << shift, (uint32)edge << shift);
}

uint8 gpio_irq_pending(gpio_pin_t p)
{
    return (uint8)((CY_GET_REG32(PRT_REG(p, GPIO_INTR_OFS)) >> GPIO_PIN_OF(p)) & 1u);
}

void gpio_irq_clear(gpio_pin_t p)
{
    /* Write-1-to-clear: write only this pin's bit, never RMW. */
    CY_SET_REG32(PRT_REG(p, GPIO_INTR_OFS), (uint32)1u << GPIO_PIN_OF(p));
}
