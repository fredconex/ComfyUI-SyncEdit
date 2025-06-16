import nodes
import folder_paths
import os  


class SyncTextEditorNode:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "text_content": ("STRING", {
                    "multiline": True,
                    "default": "",
                    "dynamicPrompts": False
                }),
                "auto_sync": ("BOOLEAN", {"default": False}),
            },
            "optional": {
                "input_string": ("STRING", {
                    "forceInput": True,
                    "multiline": True,
                    "dynamicPrompts": False
                }),
            }
        }

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("text",)
    FUNCTION = "execute"
    CATEGORY = "utils"
    OUTPUT_NODE = True

    def execute(self, text_content, auto_sync, input_string=None):
        final_output_text = text_content
        actual_input_this_exec = input_string if input_string is not None else ""

        ui_data = {
            "text_from_input_executed": [actual_input_this_exec]
        }

        if auto_sync and input_string is not None:
            final_output_text = input_string
            ui_data["text_widget_should_be"] = [input_string]

        return {"ui": ui_data, "result": (final_output_text,)}


NODE_CLASS_MAPPINGS = {
    "SyncTextEditor": SyncTextEditorNode,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "SyncTextEditor": "Sync Text Editor",
}