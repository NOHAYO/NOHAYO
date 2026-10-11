/*******************************************************************************
* File: board.c
*
* Board support for the CYBLE-222014-01 (U12) section of the schematic.
*******************************************************************************/
#include "board.h"

#define HOST_RESET_PULSE_MS   (10u)
#define HOST_BOOT_SETTLE_MS   (50u)

volatile uint8 board_pmic_event = 0u;

static const gpio_pin_t ledPins[LED_COUNT] = { PIN_UI_LED1, PIN_UI_LED2, PIN_UI_LED3 };

static uint8 level(uint8 active, uint8 activeLevel)
{
    return (0u != active) ? activeLevel : (uint8)(activeLevel ^ 1u);
}

CY_ISR(PmicInt_Isr)
{
    if (0u != gpio_irq_pending(PIN_PMIC_INT))
    {
        gpio_irq_clear(PIN_PMIC_INT);
        board_pmic_event = 1u;
    }
}

void board_init(void)
{
    uint32 i;

    /* Outputs: write the inactive level first, then enable the driver. */
    for (i = 0u; i < (uint32)LED_COUNT; i++)
    {
        gpio_init(ledPins[i], GPIO_DM_STRONG, level(0u, LED_ACTIVE_LEVEL));
    }
    gpio_init(PIN_KOUT,     GPIO_DM_STRONG, level(0u, KOUT_ACTIVE_LEVEL));
    gpio_init(PIN_SHDN_PWR, GPIO_DM_STRONG, level(0u, SHDN_PWR_ACTIVE_LEVEL));

    /* Host MCU: normal boot, reset released. NRST is open-drain low so the
     * host's own reset circuit / button still works. */
    gpio_init(PIN_BOOT0, GPIO_DM_STRONG, level(0u, BOOT0_ACTIVE_LEVEL));
    gpio_init(PIN_NRST,  GPIO_DM_OD_LOW, 1u);

    /* PMIC interrupt: active-low, internal pull-up (DR must be 1). */
    gpio_init(PIN_PMIC_INT, GPIO_DM_PULLUP, 1u);
    gpio_irq_config(PIN_PMIC_INT, GPIO_IRQ_FALLING);
    CyIntSetVector(PMIC_INT_IRQ_NUM, &PmicInt_Isr);
    CyIntSetPriority(PMIC_INT_IRQ_NUM, PMIC_INT_IRQ_PRIORITY);
    CyIntEnable(PMIC_INT_IRQ_NUM);

    /* Unused pad. */
    gpio_init(PIN_NC_P0_5, GPIO_DM_ANALOG, 0u);

    /* Pins NOT touched here (owned by PSoC Creator components / hardware):
     *   P0.6 SWDIO, P0.7 SWDCLK  - debug port
     *   P3.4 SDA, P3.5 SCL       - I2C  (SCB component, see README)
     *   P1.4 RX,  P1.5 TX        - UART (SCB component, see README)
     *   P3.7 VMon                - ADC_SAR_Seq input
     *   XRES                     - dedicated reset pin */
}

void board_led_set(board_led_t led, uint8 on)
{
    if (led < LED_COUNT)
    {
        gpio_write(ledPins[led], level(on, LED_ACTIVE_LEVEL));
    }
}

void board_led_toggle(board_led_t led)
{
    if (led < LED_COUNT)
    {
        gpio_toggle(ledPins[led]);
    }
}

void board_kout_set(uint8 active)
{
    gpio_write(PIN_KOUT, level(active, KOUT_ACTIVE_LEVEL));
}

void board_shdn_pwr_set(uint8 active)
{
    gpio_write(PIN_SHDN_PWR, level(active, SHDN_PWR_ACTIVE_LEVEL));
}

static void host_reset_pulse(void)
{
    gpio_write(PIN_NRST, 0u);
    CyDelay(HOST_RESET_PULSE_MS);
    gpio_write(PIN_NRST, 1u);
}

void board_host_reset(void)
{
    gpio_write(PIN_BOOT0, level(0u, BOOT0_ACTIVE_LEVEL));
    host_reset_pulse();
}

void board_host_enter_bootloader(void)
{
    gpio_write(PIN_BOOT0, level(1u, BOOT0_ACTIVE_LEVEL));
    host_reset_pulse();
    CyDelay(HOST_BOOT_SETTLE_MS);   /* host samples BOOT0 after reset */
    gpio_write(PIN_BOOT0, level(0u, BOOT0_ACTIVE_LEVEL));
}

uint8 board_pmic_int_asserted(void)
{
    return (uint8)(gpio_read(PIN_PMIC_INT) ^ 1u);
}
