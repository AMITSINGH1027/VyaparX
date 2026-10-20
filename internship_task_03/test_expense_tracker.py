import unittest
from expense_tracker import ExpenseTracker
class TrackerTests(unittest.TestCase):
 def test_totals_and_categories(self):
  t=ExpenseTracker(); t.add('Food',100); t.add('Food',50); t.add('Travel',25)
  self.assertEqual(t.total(),175); self.assertEqual(t.by_category(),{'Food':150,'Travel':25})
 def test_invalid_expense(self):
  with self.assertRaises(ValueError): ExpenseTracker().add('',0)
if __name__=='__main__': unittest.main()
