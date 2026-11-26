"""A small window for the boiler, built with tkinter (included with Python).

Every Dolphin call runs on a background thread so the window never freezes;
results come back to the window through `after()`.
"""

from __future__ import annotations

import queue
import threading
import tkinter as tk
from tkinter import messagebox, ttk

from .boiler import Boiler
from .cli import fmt
from .client import DolphinError, Status

REFRESH_MS = 30_000


class App:
    def __init__(self, root: tk.Tk, boiler: Boiler | None = None):
        self.root = root
        self.boiler = boiler or Boiler()
        self.results: queue.Queue = queue.Queue()
        self.busy = False
        root.title("Dolphin boiler")
        root.minsize(340, 0)
        root.resizable(False, False)

        self.frame = ttk.Frame(root, padding=16)
        self.frame.grid(sticky="nsew")
        self.root.after(100, self._drain)

        if self.boiler.signed_in:
            self.show_main()
        else:
            self.show_login()

    # --- plumbing ---------------------------------------------------------

    def _clear(self):
        for w in self.frame.winfo_children():
            w.destroy()

    def run_bg(self, fn, done, busy_text="Working…"):
        if self.busy:
            return
        self.busy = True
        self._set_busy(busy_text)

        def work():
            try:
                self.results.put((done, fn(), None))
            except DolphinError as e:
                self.results.put((done, None, e))
            except Exception as e:  # pragma: no cover - unexpected
                self.results.put((done, None, DolphinError(f"Unexpected error: {type(e).__name__}")))

        threading.Thread(target=work, daemon=True).start()

    def _drain(self):
        try:
            while True:
                done, value, err = self.results.get_nowait()
                self.busy = False
                self._set_busy(None)
                if err is not None:
                    self.on_error(err)
                else:
                    done(value)
        except queue.Empty:
            pass
        self.root.after(100, self._drain)

    def _set_busy(self, text):
        if hasattr(self, "note") and self.note.winfo_exists():
            self.note.config(text=text or "")
        for b in getattr(self, "buttons", []):
            if b.winfo_exists():
                b.state(["disabled"] if text else ["!disabled"])

    def on_error(self, e: DolphinError):
        if e.code == "unauthorized" and not self.boiler.signed_in:
            self.show_login(str(e))
            return
        if hasattr(self, "note") and self.note.winfo_exists():
            self.note.config(text=str(e), foreground="#b00020")
        else:
            messagebox.showerror("Dolphin boiler", str(e))

    # --- sign in ----------------------------------------------------------

    def show_login(self, message: str = ""):
        self._clear()
        f = self.frame
        ttk.Label(f, text="Sign in to Dolphin", font=("", 14, "bold")).grid(columnspan=2, sticky="w", pady=(0, 8))
        ttk.Label(f, text="Use the same email and password as the Dolphin phone app.").grid(columnspan=2, sticky="w")
        ttk.Label(f, text="Email").grid(row=2, column=0, sticky="w", pady=(10, 2))
        self.email = ttk.Entry(f, width=32)
        self.email.insert(0, self.boiler.email or "")
        self.email.grid(row=3, column=0, columnspan=2, sticky="ew")
        ttk.Label(f, text="Password").grid(row=4, column=0, sticky="w", pady=(8, 2))
        self.password = ttk.Entry(f, width=32, show="•")
        self.password.grid(row=5, column=0, columnspan=2, sticky="ew")
        ttk.Label(f, text="Your password is not saved. Only Dolphin's sign-in key is kept,\nin your computer's secure password store.", foreground="#555").grid(row=6, columnspan=2, sticky="w", pady=(8, 0))
        btn = ttk.Button(f, text="Sign in", command=self._do_login)
        btn.grid(row=7, column=0, sticky="w", pady=(12, 0))
        self.buttons = [btn]
        self.note = ttk.Label(f, text=message, foreground="#b00020", wraplength=320)
        self.note.grid(row=8, columnspan=2, sticky="w", pady=(8, 0))
        self.root.bind("<Return>", lambda _e: self._do_login())
        (self.password if self.boiler.email else self.email).focus_set()

    def _do_login(self):
        email, password = self.email.get(), self.password.get()
        self.password.delete(0, "end")
        self.run_bg(lambda: self.boiler.sign_in(email, password), lambda _d: self.show_main(), "Signing in…")

    # --- main screen ------------------------------------------------------

    def show_main(self):
        self._clear()
        self.root.unbind("<Return>")
        f = self.frame
        top = ttk.Frame(f)
        top.grid(sticky="ew")
        self.device_label = ttk.Label(top, text=self.boiler.device or "Boiler", font=("", 11, "bold"))
        self.device_label.pack(side="left")
        ttk.Button(top, text="Sign out", command=self._sign_out).pack(side="right")

        self.temp_label = ttk.Label(f, text="– °C", font=("", 36, "bold"))
        self.temp_label.grid(sticky="w", pady=(8, 0))
        self.state_label = ttk.Label(f, text="Loading…", font=("", 11))
        self.state_label.grid(sticky="w")
        self.ready_label = ttk.Label(f, text="", foreground="#555")
        self.ready_label.grid(sticky="w", pady=(2, 10))

        ttk.Label(f, text="Heat water for").grid(sticky="w")
        row = ttk.Frame(f)
        row.grid(sticky="w", pady=(2, 10))
        self.buttons = []
        for n in (1, 2, 3, 4):
            b = ttk.Button(row, text=f"{n} shower{'s' if n > 1 else ''}", width=10, command=lambda n=n: self._showers(n))
            b.pack(side="left", padx=(0, 4))
            self.buttons.append(b)

        row2 = ttk.Frame(f)
        row2.grid(sticky="ew")
        self.stop_btn = ttk.Button(row2, text="Stop heating", command=self._stop)
        self.stop_btn.pack(side="left")
        self.shabbat_btn = ttk.Button(row2, text="Shabbat mode", command=self._toggle_shabbat)
        self.shabbat_btn.pack(side="left", padx=6)
        refresh = ttk.Button(row2, text="Refresh", command=self.refresh)
        refresh.pack(side="right")
        # One call at a time keeps the order of commands predictable, so every
        # button (Stop too) is disabled only while a call is in flight.
        self.buttons += [self.shabbat_btn, refresh, self.stop_btn]

        self.note = ttk.Label(f, text="", wraplength=320)
        self.note.grid(sticky="w", pady=(10, 0))
        self.status: Status | None = None
        self.refresh()
        self._schedule()

    def _schedule(self):
        def tick():
            if self.boiler.signed_in and hasattr(self, "temp_label") and self.temp_label.winfo_exists():
                if not self.busy:
                    self.refresh(quiet=True)
                self.root.after(REFRESH_MS, tick)

        self.root.after(REFRESH_MS, tick)

    def show_status(self, s: Status | None, message: str = ""):
        if s is None:
            self.note.config(text=message or "Done. Could not read the status afterwards.", foreground="")
            return
        self.status = s
        self.device_label.config(text=self.boiler.device or "Boiler")
        self.temp_label.config(text=f"{fmt(s.temperature)} °C")
        if s.shabbat:
            state = "Shabbat mode is on"
        elif s.power:
            state = f"Heating to {fmt(s.target_temperature)} °C"
        else:
            state = "Not heating"
        self.state_label.config(text=state)
        ready = [sh.count for sh in s.showers if s.ready_for(sh.count)]
        self.ready_label.config(text=f"Hot enough for {max(ready)} shower{'s' if max(ready) > 1 else ''}" if ready else "Not hot enough for a shower yet")
        self.shabbat_btn.config(text="Turn Shabbat off" if s.shabbat else "Turn Shabbat on")
        for b in self.buttons[:4]:
            b.state(["disabled"] if s.shabbat else ["!disabled"])
        self.note.config(text=message, foreground="")

    def refresh(self, quiet: bool = False):
        self.run_bg(self.boiler.status, self.show_status, "" if quiet else "Reading the boiler…")

    def _showers(self, n: int):
        def done(result):
            s, started = result
            self.show_status(s, f"Heating for {n} shower{'s' if n > 1 else ''}." if started else "Already hot enough. Not heating.")

        self.run_bg(lambda: self.boiler.heat_for_showers(n), done, "Starting…")

    def _stop(self):
        self.run_bg(self.boiler.stop, lambda s: self.show_status(s, "Heating stopped."), "Stopping…")

    def _toggle_shabbat(self):
        on = not (self.status and self.status.shabbat)
        if on and not messagebox.askyesno("Shabbat mode", "Turn on Shabbat mode? The boiler will follow its Shabbat schedule and this app won't heat until you turn it off."):
            return
        self.run_bg(lambda: self.boiler.set_shabbat(on), lambda s: self.show_status(s, f"Shabbat mode {'on' if on else 'off'}."), "Sending…")

    def _sign_out(self):
        self.boiler.sign_out()
        self.show_login("Signed out.")


def run():
    root = tk.Tk()
    App(root)
    root.mainloop()


if __name__ == "__main__":  # pragma: no cover
    run()
