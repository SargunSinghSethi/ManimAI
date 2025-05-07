import ast

PROHIBITED_IMPORTS = {"os", "sys", "subprocess", "socket", "urllib"}
PROHIBITED_FUNCTIONS = {"open", "eval", "exec", "compile", "globals", "locals", "input"}
ALLOWED_BASE_CLASSES = {
    "Scene", 
    "ThreeDScene", 
    "MovingCameraScene", 
    "ZoomedScene", 
    "LinearTransformationScene",
    "Axes",
    "NumberPlane",
    "VectorScene",
    "ReconfigurableScene"
}  # Only allow Manim Scene subclassing

def sanitize_ast(code: str):
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        return False, f"Syntax error in code: {str(e)}"

    for node in ast.walk(tree):
        # Check for prohibited imports
        if isinstance(node, ast.Import):
            for alias in node.names:
                if alias.name.split('.')[0] in PROHIBITED_IMPORTS:
                    return False, f"Use of prohibited import: {alias.name}"

        if isinstance(node, ast.ImportFrom):
            if node.module and node.module.split('.')[0] in PROHIBITED_IMPORTS:
                return False, f"Use of prohibited import: {node.module}"

        # Check for prohibited function calls
        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name) and node.func.id in PROHIBITED_FUNCTIONS:
                return False, f"Use of prohibited function: {node.func.id}"
            if isinstance(node.func, ast.Attribute) and node.func.attr in PROHIBITED_FUNCTIONS:
                return False, f"Use of prohibited attribute: {node.func.attr}"

        # Check for prohibited attributes usage (globals, locals, etc.)
        if isinstance(node, ast.Name) and node.id in PROHIBITED_FUNCTIONS:
            return False, f"Use of prohibited identifier: {node.id}"

        # Check class inheritance
        if isinstance(node, ast.ClassDef):
            for base in node.bases:
                if isinstance(base, ast.Name) and base.id not in ALLOWED_BASE_CLASSES:
                    return False, f"Unauthorized base class: {base.id}"

    return True, "Code passed AST analysis"
