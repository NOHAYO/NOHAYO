import sys

from .cli import main

if len(sys.argv) == 1:
    # No command: open the window.
    from .gui import run

    run()
else:
    sys.exit(main())
