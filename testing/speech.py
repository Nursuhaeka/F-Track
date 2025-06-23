import speech_recognition as sr

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
