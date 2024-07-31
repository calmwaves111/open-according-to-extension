import {
	App,
	Plugin,
	PluginSettingTab,
	Setting,
	Notice,
	TFile,
} from "obsidian";
import * as child_process from "child_process";

interface FileExecutorSettings {
	exeMap: { [key: string]: string };
}

const DEFAULT_SETTINGS: FileExecutorSettings = {
	exeMap: {
		pdf: "D:/DocBox/DocBox.exe", // 默认文件类型和对应的exe路径
	},
};

export default class FileExecutorPlugin extends Plugin {
	settings: FileExecutorSettings;

	async onload() {
		console.log("loading FileExecutorPlugin");
		await this.loadSettings();
		this.registerEvents();
		this.addSettingTab(new FileExecutorSettingTab(this.app, this));
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	registerEvents() {
		this.app.workspace.on("file-open", (file: TFile) => {
			const fileExtension = file.name.split(".").pop()?.toLowerCase();
			if (!fileExtension) {
				new Notice("Unable to determine file type.", 0);
				return;
			}

			const exePath = this.settings.exeMap[fileExtension];
			if (exePath) {
				const basePath = (this.app.vault.adapter as any).getBasePath();
				const fullPath = `${basePath}/${file.path}`;
				// console.log('Full path:', fullPath);
				this.openFileWithExe(fullPath, exePath);

                //!关掉在ob中打开的文件
				// 找到当前活动组的所有文件
				//@ts-ignore
				const activeTabGroup = this.app.workspace.activeTabGroup;
				if (activeTabGroup) {
					// 获取所有当前活动选项卡的文件路径
					//@ts-ignore
					const activeTabFiles = activeTabGroup.children.map((tab) => tab.view.getState().file);
					// 查找文件路径的索引
					const fileTabIndex = activeTabFiles.indexOf(file.path);

					// 如果文件存在于活动选项卡中，关闭该选项卡
					if (fileTabIndex !== -1) {
						const leaf = activeTabGroup.children[fileTabIndex];
						leaf.detach();
					}
				}
			}
		});
	}

	openFileWithExe(filePath: string, exePath: string) {
		child_process.exec(
			`"${exePath}" "${filePath}"`,
			(error, stdout, stderr) => {
				if (error) {
					console.error("Error executing file with exe:", error);
					new Notice(
						"Error opening file with specified exe: " +
							error.message
					);
				} else {
					console.log("File opened with exe:", stdout);
				}
			}
		);
	}
}

class FileExecutorSettingTab extends PluginSettingTab {
	plugin: FileExecutorPlugin;

	constructor(app: App, plugin: FileExecutorPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let { containerEl } = this;

		containerEl.empty();
		containerEl.createEl("h2", { text: "File Executor Settings" });

		new Setting(containerEl)
			.setName("Add new file extension mapping")
			.setDesc("Add a new mapping of file extension to executable path.")
			.addText((cb) => {
				cb.inputEl.addClass("file-extension");
				cb.setPlaceholder("File Extension (e.g. 'pdf')");
			})
			.addText((cb) => {
				cb.inputEl.addClass("exe-path");
				cb.setPlaceholder("Exe Path，use / instead of\\");
			})
			.addButton((btn) => {
				btn.setButtonText("+")
					.setCta()
					.onClick(async () => {
						//@ts-ignore
						const fileExtension = document.querySelector(".file-extension").value.toLowerCase();
						//@ts-ignore
						const exePath =document.querySelector(".exe-path").value;

						if (fileExtension && exePath) {
							this.plugin.settings.exeMap[fileExtension] =
								exePath;
							await this.plugin.saveSettings();
							this.display();
							new Notice(`Mapping for ${fileExtension} added.`);
						} else {
							new Notice(
								"File Extension and Executable Path are required."
							);
						}
					});
			});

		containerEl.createEl("h3", { text: "Current Mappings" });
		for (const [fileExtension, exePath] of Object.entries(
			this.plugin.settings.exeMap
		)) {
			new Setting(containerEl)
				.setName(fileExtension)
				.setDesc(exePath)
				.addButton((btn) => {
					btn.setIcon("trash")
						.setTooltip("Remove")
						.onClick(async () => {
							delete this.plugin.settings.exeMap[fileExtension];
							await this.plugin.saveSettings();
							this.display();
							new Notice(`Mapping for ${fileExtension} removed.`);
						});
				});
		}
	}
}
