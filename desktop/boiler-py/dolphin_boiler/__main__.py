import sys

from .cli import main, open_window

if len(sys.argv) == 1:
    # No command: open the window.
    sys.exit(open_window())
else:
    sys.exit(main())
