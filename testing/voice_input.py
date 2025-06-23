# voice_input.py
import speech_recognition as sr
import requests

def listen_for_expense_or_budget():
    recognizer = sr.Recognizer()
    with sr.Microphone() as source:
        print("Listening for input...")
        audio = recognizer.listen(source)
        try:
            text = recognizer.recognize_google(audio)
            print(f"Detected: {text}")
            return text
        except sr.UnknownValueError:
            print("Sorry, I couldn't understand the audio.")
            return None
        except sr.RequestError:
            print("API request error.")
            return None

def send_expense_to_backend(text):
    # Assuming the text contains a category and amount, we need to split it (you can improve this logic)
    if text:
        # Basic assumption that the text format is like: "food 20"
        parts = text.split()
        if len(parts) == 2:
            category = parts[0]
            amount = float(parts[1])

            # Send the expense data to Flask API (POST request)
            data = {
                'category': category,
                'amount': amount
            }
            response = requests.post('http://127.0.0.1:8000/push_expense', json=data)
            if response.status_code == 200:
                print("Expense data successfully saved to Firebase.")
            else:
                print("Error saving expense data.")
