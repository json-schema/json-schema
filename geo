{
    "$schema": "http://json-schema.org/draft-04/schema#",
    "description": "A geographical coordinate",
    "type": "object",
    "properties": {
        "latitude": {
          "type": "number",
          "minimum": -90,
          "maximum": 90
        },
        "longitude": {
          "type": "number",
          "minimum": -180,
          "maximum": 180
        }
    },
    "required": ["latitude", "longitude"]
}
