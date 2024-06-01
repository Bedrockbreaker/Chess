shader_type canvas_item;

uniform vec3 highlight : source_color = vec3(1.0, 1.0, 1.0);
uniform vec3 bright : source_color = vec3(0.90196, 0.89412, 0.94902);
uniform vec3 midtone : source_color = vec3(0.74118, 0.74118, 0.83529);
uniform vec3 shade : source_color = vec3(0.53333, 0.52157, 0.63137);
uniform vec3 dark : source_color = vec3(0.39608, 0.38824, 0.46275);

const int highlightSource = 0xFFFFFF;
const int brightSource = 0xE6E4F2;
const int midtoneSource = 0xBDBDD5;
const int shadeSource = 0x8885A1;
const int darkSource = 0x656376;

void fragment() {
	COLOR = texture(TEXTURE, UV);

	int hex = (int(COLOR.r * 255.0) << 16) + (int(COLOR.g * 255.0) << 8) + int(COLOR.b * 255.0);

	switch(hex) {
		case highlightSource:
			COLOR.rgb = highlight;
			break;
		case brightSource:
			COLOR.rgb = bright;
			break;
		case midtoneSource:
			COLOR.rgb = midtone;
			break;
		case shadeSource:
			COLOR.rgb = shade;
			 break;
		case darkSource:
			COLOR.rgb = dark;
			break;
	}
}