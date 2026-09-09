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
            container_statuses = pod.status.container_statuses or []

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
                    "container_statuses": [
                        {
                            "name": status.name,
                            "ready": status.ready,
                            "restart_count": status.restart_count,
                            "state": (
                                "running"
                                if status.state.running
                                else "waiting"
                                if status.state.waiting
                                else "terminated"
                            ),
                            "reason": (
                                status.state.waiting.reason
                                if status.state.waiting
                                else status.state.terminated.reason
                                if status.state.terminated
                                else None
                            ),
                        }
                        for status in container_statuses
                    ],
                }
            )

        return result

    def get_events(self, namespace: str = "opspilot") -> list[dict]:
        events = self.core_api.list_namespaced_event(namespace)

        return [
            {
                "type": event.type,
                "reason": event.reason,
                "message": event.message,
                "object": (
                    f"{event.involved_object.kind}/"
                    f"{event.involved_object.name}"
                ),
                "timestamp": (
                    event.last_timestamp.isoformat()
                    if event.last_timestamp
                    else None
                ),
            }
            for event in events.items
        ]

    def get_logs(
        self,
        pod_name: str,
        namespace: str = "opspilot",
        container: str | None = None,
        tail_lines: int = 100,
    ) -> str:
        return self.core_api.read_namespaced_pod_log(
            name=pod_name,
            namespace=namespace,
            container=container,
            tail_lines=tail_lines,
        )


if __name__ == "__main__":
    tool = KubernetesTool()

    print("\n=== PODS ===")
    for pod in tool.get_pods():
        print(pod)

    print("\n=== EVENTS ===")
    for event in tool.get_events():
        print(event)

    print("\n=== LOGS ===")
    pods = tool.get_pods()

    if pods:
        print(
            tool.get_logs(
                pod_name=pods[0]["name"],
                namespace="opspilot",
                tail_lines=20,
            )
        )