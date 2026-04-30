import json
import tempfile
import unittest
from pathlib import Path

from integration_matrix.components import load_components


class LoadComponentsTest(unittest.TestCase):
    def test_loads_csv_components(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "components.csv"
            path.write_text(
                "partner,task,component\nACME,T1.1,Order Service\n,T2.1,Analytics Engine\n",
                encoding="utf-8",
            )

            components = load_components(path)

        self.assertEqual(len(components), 2)
        self.assertEqual(components[0].partner, "ACME")
        self.assertEqual(components[0].task, "T1.1")
        self.assertEqual(components[0].component, "Order Service")
        self.assertEqual(components[1].partner, "")

    def test_loads_json_components_with_missing_optional_fields(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "components.json"
            path.write_text(json.dumps([{"component": "Analytics Engine"}]), encoding="utf-8")

            components = load_components(path)

        self.assertEqual(len(components), 1)
        self.assertEqual(components[0].partner, "")
        self.assertEqual(components[0].task, "")
        self.assertEqual(components[0].component, "Analytics Engine")

    def test_rejects_missing_component_field(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "components.csv"
            path.write_text("partner,task\nACME,T1.1\n", encoding="utf-8")

            with self.assertRaisesRegex(ValueError, "component"):
                load_components(path)

    def test_rejects_blank_component_value(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "components.json"
            path.write_text(json.dumps([{"partner": "ACME", "component": " "}]), encoding="utf-8")

            with self.assertRaisesRegex(ValueError, "Component is required"):
                load_components(path)


if __name__ == "__main__":
    unittest.main()
