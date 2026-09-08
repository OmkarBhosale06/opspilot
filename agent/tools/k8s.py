from kubernetes import client, config

class KubernetesTool:
    def __init__(self):
        try:
            config.load_kube_config()
        except Exception:
            config.load_incluster_config()

        self.core_api = client.CoreV1Api()
        self.apps_api = client.AppsV1Api()

    def get_pods(self, namespace: str = "opspilot") -> list[dict]:
        pods = self.core_api.list_namespaced_pod(namespace)

        result = []

        for pod in pods.items:
            result.append(
                {
                    "name": pod.metadata.name,
                    "namespace": pod.metadata.namespace,
                    "phase": pod.status.phase,
                    "node": pod.spec.node_name,
                    "containers": [
                        {
                            "name": container.name,
                            "image": container.image,
                        }
                        for container in pod.spec.containers
                    ],
                }
            )

        return result


if __name__ == "__main__":
    tool = KubernetesTool()

    for pod in tool.get_pods():
        print(pod)