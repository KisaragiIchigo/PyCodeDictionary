import sys
from PySide6.QtWidgets import QApplication
from utils import set_graphviz_on_path
from gui import MainWindow

if __name__ == "__main__":
    set_graphviz_on_path() 
    app = QApplication(sys.argv)
    w = MainWindow()
    w.show()
    sys.exit(app.exec())
