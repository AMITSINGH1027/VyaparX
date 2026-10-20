"""Task 2 demonstration of Python functions, collections, validation, and tests."""


def calculate_average(scores: list[float]) -> float:
    """Return the mean score and reject an empty collection."""
    if not scores:
        raise ValueError("scores must not be empty")
    return sum(scores) / len(scores)


def classify_score(score: float) -> str:
    """Map a numeric score to a readable performance band."""
    if not 0 <= score <= 100:
        raise ValueError("score must be between 0 and 100")
    if score >= 75:
        return "Excellent"
    if score >= 50:
        return "Good"
    return "Needs improvement"


def main() -> None:
    scores = [82, 74, 91, 68]
    average = calculate_average(scores)
    print(f"Scores: {scores}")
    print(f"Average: {average:.2f}")
    print(f"Performance: {classify_score(average)}")


if __name__ == "__main__":
    main()
