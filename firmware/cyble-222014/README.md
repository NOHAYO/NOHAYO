# CYBLE-222014-01 firmware (U12)

Pin setup and drivers for the EZ-BLE module CYBLE-222014-01. The module contains a
CY8C4248LQI-BL583 (PSoC 4 BLE, Cortex-M0, 256 KB flash). The pin map is in
`board_pins.h`.

| File | Purpose |
|---|---|
| `board_pins.h` | Pin map from the schematic, plus the active level of each output |
| `gpio_drv.h/.c` | Register-level GPIO driver: drive mode, read/write/toggle, edge IRQs |
| `board.h/.c` | `board_init()` puts every pin in a safe state; LED, KOUT, SHDN_Pwr, host BOOT0/NRST and PMIC_INT helpers |
| `main.c` | Bring-up demo: blinks UI_LED1 and toggles UI_LED2 on each PMIC_INT event |

## Creating the project (PSoC Creator 4.x)

The CYBLE-222014-01 is supported by PSoC Creator. ModusToolbox does not support it.

1. **File → New → Project → Target device → PSoC 4 → `CYBLE-222014-01`**, then
   choose an empty schematic.
2. Copy these `.c`/`.h` files into the project folder and add them with
   **Add → Existing Item**. Replace the generated `main.c` with this one.
3. **Don't place Pin components** for the GPIOs that `board.c` drives (LEDs, BOOT0,
   NRST, KOUT, SHDN_Pwr, PMIC_INT). The driver configures them directly. If you
   place a Pin component on one of those pins later, remove it from `board_init()`.
4. Optional peripherals. Add them to `TopDesign.cysch` and assign pins in the
   `.cydwr` **Pins** tab:

   | Component | Name | Pins (.cydwr) |
   |---|---|---|
   | SCB, I2C master | `I2C` | `\I2C:sda\` → P3[4], `\I2C:scl\` → P3[5] (SCB1) |
   | SCB, UART | `UART` | `\UART:rx\` → P1[4], `\UART:tx\` → P1[5] |
   | ADC_SAR_Seq, 1 single-ended channel | `ADC` | analog Pin `VMon` → P3[7] |
   | BLE | `BLE` | none (radio) |

   Then call `I2C_Start()`, `UART_Start()` and `ADC_Start()` after `board_init()`.
5. **System tab (.cydwr):** keep **Debug Select = SWD** so P0[6]/P0[7] stay
   SWDIO/SWDCLK.
6. Build, then program over SWD (MiniProg3/4 or KitProg on SWDIO, SWDCLK, XRES).

## Check against the schematic before first power-up

The screenshot left these points unclear:

- **Pads 7/9/10:** this map uses PMIC_INT = P1.6, UI_LED2 = P0.4, P0.5 not connected.
- **Pads 16/17/18:** SDA = P3.4 and SCL = P3.5 are fixed by the hardware
  (SCB1 I2C), so VMon = P3.7.
- **UART on P1.4/P1.5:** the nets are named `SCB1_TX`/`SCB1_RX`, but PSoC Creator
  picks the SCB block when you place the UART. I2C already uses SCB1, so the UART
  must use SCB0. Confirm that P1.4/P1.5 are allowed for the UART in the `.cydwr`
  pin picker.
- **Active levels** of the LEDs, SHDN_Pwr, KOUT and BOOT0: set them in `board_pins.h`.
- **`PMIC_INT_IRQ_NUM`:** the GPIO port 1 interrupt is IRQ 1 on PSoC 4 BLE. Confirm
  it in the generated `cydevice_trm.h` or the device datasheet.
