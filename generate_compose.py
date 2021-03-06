import os
import yaml

with open("configs.yml") as f:
    config = yaml.load(f, Loader=yaml.FullLoader)

users = config["users"]

result = {}

result["version"] = "3"
result["services"] = {}

ofelia_labels = {}
folders_to_create = set()

for mode in ["yiqingtong", "checkup"]:
    if mode not in config:
        continue
    space_out = config[mode]["space_out"]
    hours = ",".join(str(i) for i in config[mode]["hours"])
    second = 0
    minute = ",".join(str(i) for i in config[mode].get("minute", [0]))
    
    for user in users:
        name = user['name']
        service_name = f"{name}_{mode}"
        container_name = f"yiqingtong_{service_name}"
        coords = config[mode]["coords"] if "coords" in config[mode] else user["coords"]
        username = user["username"]
        password = user["password"]

        if not all([name, service_name, container_name, coords, username, password]):
            print(f"Config for {name}({mode}) incomplete, skipped")
            continue

        result["services"][service_name] = {
            "image": "chenseanxy/yiqingtong-puppeteer:latest",
            "container_name": container_name,
            "restart": "no",
            "volumes": [f"./screens/{name}:/usr/src/app/screens"],
            "environment": {
                "XD_USERNAME": username,
                "XD_PASSWORD": password,
                "COORDS": coords,
                "MODE": mode,
            }
        }

        folders_to_create.add(f"./screens/{name}")

        ofelia_labels[f"ofelia.job-run.{service_name}.container"] = container_name
        ofelia_labels[f"ofelia.job-run.{service_name}.schedule"] = f"{second} {minute} {hours} * * *"
        
        second += space_out
        minute += second // 60
        second = second % 60
        if minute >= 60:
            raise ValueError("Too many jobs, can't schedule all jobs within one hour")

    print(f"{mode}: scheduled up to [{hours}]:{minute:02}:{second:02}")

result["services"]["ofelia"] = {
    "image": "mcuadros/ofelia:latest",
    "restart": "always",
    "command": "daemon --docker",
    "volumes": ["/var/run/docker.sock:/var/run/docker.sock"],
    "labels": ofelia_labels,
    "environment": {"TZ": "Asia/Shanghai"},
}

for folder in folders_to_create:
    if not os.path.exists(folder):
        os.makedirs(folder)

with open("docker-compose.yml", "w") as f:
    yaml.dump(result, f)

print(f"Generated {len(users)} users, {len(result['services'])} services")
