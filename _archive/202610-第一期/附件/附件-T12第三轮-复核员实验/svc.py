"""真进程服务：create_app + 假 Key（不读凭据管理器），先把两组地址写成 127.0.0.1（395 = 本机假 395，6000D = 死端口）。"""
import pathlib
import sys

import uvicorn

from lawbench.app import create_app
from lawbench.config import Config
from lawbench.settings import SettingsStore

appdata = pathlib.Path(sys.argv[1])
port = int(sys.argv[2])
prep = sys.argv[3]
appdata.mkdir(parents=True, exist_ok=True)
ss = SettingsStore(appdata)
s = ss.get()
s["servers"] = {"llm_base_url": "http://127.0.0.1:19459/v1", "llm_alt_base_url": None,
                "prep_base_url": prep, "prep_alt_base_url": None}
ss.put(s)
app = create_app(Config(token="c" * 40, appdata=appdata, forward_port=19458), key_getter=lambda: "sk-lab-fake-c18")
uvicorn.Server(uvicorn.Config(app, host="127.0.0.1", port=port, access_log=False, log_level="warning",
                              log_config=None, lifespan="on")).run()
