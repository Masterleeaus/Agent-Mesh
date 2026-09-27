# Pass 4 compatibility boundary

This app now consumes shared navigation/module/role infrastructure from Titan Apps: Core. Legacy `App\Extensions\Chatbot` data-model/contracts remain temporarily referenced by app-specific data providers and presentation persistence. Those model dependencies are explicit migration debt for the next pass; shared UI infrastructure is no longer duplicated here.
