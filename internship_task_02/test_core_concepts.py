import unittest

from core_concepts import calculate_average, classify_score


class CoreConceptTests(unittest.TestCase):
    def test_average(self):
        self.assertEqual(calculate_average([60, 80]), 70)

    def test_classification(self):
        self.assertEqual(classify_score(88), "Excellent")
        self.assertEqual(classify_score(52), "Good")

    def test_invalid_score(self):
        with self.assertRaises(ValueError):
            classify_score(101)


if __name__ == "__main__":
    unittest.main()
