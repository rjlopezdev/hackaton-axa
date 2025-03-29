# En app/commands.py
import click
from flask.cli import with_appcontext
import subprocess
from pathlib import Path

@click.command('run-ui-main')
@with_appcontext
def run_ui_main_command():
    """Ejecuta el script ui_main.py"""
    base_dir = Path(__file__).resolve().parent.parent
    ui_main_path = base_dir / "agent" / "ui_main.py"
    
    click.echo(f"Ejecutando {ui_main_path}...")
    subprocess.run(["python", str(ui_main_path)])
    
# En app/__init__.py
def register_commands(app):
    from app.commands import run_ui_main_command
    app.cli.add_command(run_ui_main_command)