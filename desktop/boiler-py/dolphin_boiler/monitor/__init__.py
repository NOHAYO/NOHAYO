"""Boiler monitor: logs the boiler and the weather every 10 minutes and
works out energy, efficiency and slow degradation from the log.

    config.py    settings (location, tank size, element rating)
    weather.py   outdoor weather from Open-Meteo (free, no key)
    store.py     the SQLite log
    collector.py takes one sample (boiler + weather) and stores it
    analysis.py  heating cycles, energy in vs heat gained, efficiency, trends
    alerts.py    maintenance alerts from the analysis
    report.py    text summary and an HTML page with charts
    launchd.py   runs the collector unattended on a Mac
"""
