require 'xcodeproj'

project_path = 'App.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# Get App target
app_target = project.targets.find { |t| t.name == 'App' }

# Get App group
app_group = project.main_group.find_subpath('App/App', true)

# Add Swift file
swift_file = app_group.new_file('UnityAdsCapacitorPlugin.swift')
app_target.add_file_references([swift_file])

# Add Objective-C file
objc_file = app_group.new_file('UnityAdsCapacitorPlugin.m')
app_target.add_file_references([objc_file])

project.save

puts "✅ Unity Ads plugin files added to Xcode project"
