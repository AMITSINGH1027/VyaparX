"""Simple command-line expense tracker for Internship Task 3."""
from dataclasses import dataclass

@dataclass(frozen=True)
class Expense:
    category: str
    amount: float

class ExpenseTracker:
    def __init__(self): self.expenses = []
    def add(self, category, amount):
        if not category.strip() or amount <= 0: raise ValueError('category and positive amount required')
        self.expenses.append(Expense(category.strip(), float(amount)))
    def total(self): return sum(item.amount for item in self.expenses)
    def by_category(self):
        result = {}
        for item in self.expenses: result[item.category] = result.get(item.category, 0) + item.amount
        return result

def main():
    tracker = ExpenseTracker()
    for category, amount in [('Transport', 120), ('Food', 250), ('Transport', 80)]: tracker.add(category, amount)
    print(f'Total expense: Rs. {tracker.total():.2f}')
    print('Category summary:', tracker.by_category())

if __name__ == '__main__': main()
