/*******************************************************************************
* File: main.c
*
* Minimal bring-up for the CYBLE-222014-01 board section: set up all pins,
* blink UI_LED1 and show PMIC_INT events on UI_LED2.
*******************************************************************************/
#include <project.h>
#include "board.h"

int main(void)
{
    uint32 tick = 0u;

    board_init();
    CyGlobalIntEnable;

    for (;;)
    {
        if (0u != board_pmic_event)
        {
            board_pmic_event = 0u;
            board_led_toggle(LED2);
        }

        if (++tick >= 50u)          /* 50 x 10 ms = 500 ms */
        {
            tick = 0u;
            board_led_toggle(LED1);
        }

        CyDelay(10u);
    }
}
